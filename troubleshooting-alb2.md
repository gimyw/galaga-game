# Galaga ALB 재생성 이후 트러블슈팅

---

## 1. ALB 접속 타임아웃 - master 노드가 대상 그룹에 등록됨

**증상**
```
ERR_CONNECTION_TIMED_OUT
```

**원인**
대상 그룹(`toy-pri-tg`)에 master 노드(`toy-vpc-master1`)가 등록되어 있었으나
master 노드는 32390 NodePort가 열려있지 않아 Unhealthy 상태
ALB가 Unhealthy 대상으로 트래픽을 보내 타임아웃 발생

**해결**
대상 그룹에서 master 노드 제거, worker 노드만 유지

---

## 2. ALB 접속 타임아웃 - NodePort 미확인

**증상**
worker 노드에서 `ss -tlnp | grep 32390` 결과 없음

**원인**
kube-proxy는 iptables로 NodePort를 처리하므로 `ss` 명령어에 표시되지 않음
실제로는 정상 동작 중

**확인 방법**
```bash
# worker 노드에서 직접 테스트
curl http://localhost:32390
# HTML 응답 확인 → 정상
```

---

## 3. Frontend 환경변수 미반영 - WebSocket localhost 연결

**증상**
```
WebSocket connection to 'ws://localhost:4000/' failed
```

**원인**
Dockerfile에서 ARG 선언이 `COPY . .` 이후에 위치하여
빌드 캐시로 인해 `--build-arg`로 전달한 환경변수가 적용되지 않음

**해결**
ARG/ENV 선언을 `COPY . .` 이전으로 이동
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
ARG REACT_APP_WS_URL
ARG REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
COPY . .
RUN chmod +x node_modules/.bin/react-scripts && npm run build
```

빌드 시 반드시 `--no-cache` 옵션 사용
```bash
docker build --no-cache \
  --build-arg "REACT_APP_WS_URL=ws://<ALB_DNS>:4000" \
  --build-arg "REACT_APP_API_URL=http://<ALB_DNS>" \
  -t <ECR_URI>/toy/k8s/front:latest \
  ./frontend
```

빌드 후 환경변수 적용 확인
```bash
docker run --rm <ECR_URI>/toy/k8s/front:latest \
  sh -c "grep -r 'toy-alb' /usr/share/nginx/html/static/js/ | grep -o 'ws://[^[:space:]]*'"
```

---

## 4. WebSocket 연결 실패 - Ingress rewrite-target 충돌

**증상**
```
GET /ws HTTP/1.1 → 400 Bad Request (Invalid Upgrade header)
```

**원인**
`nginx.ingress.kubernetes.io/rewrite-target: /` annotation으로 인해
`/ws` 경로가 `/`로 rewrite되면서 WebSocket 업그레이드 헤더 손실

**해결**
`rewrite-target` annotation 제거

---

## 5. WebSocket 연결 실패 - ALB:4000 리스너가 Frontend 대상 그룹으로 연결

**증상**
WebSocket 연결 시 Frontend HTML이 응답으로 반환됨
```bash
curl -H "Upgrade: websocket" http://<ALB_DNS>:4000/
# → HTML 응답 (Frontend)
```

**원인**
ALB:4000 리스너가 Frontend 대상 그룹(`toy-pri-tg`)으로 잘못 연결됨
Backend Service가 `ClusterIP` 타입이라 ALB에서 직접 접근 불가

**해결**

**1. Backend Service를 NodePort로 변경**
```yaml
# backend.yaml
spec:
  type: NodePort
  ports:
    - port: 4000
      targetPort: 4000
      nodePort: 30400
```

**2. Backend 전용 대상 그룹 생성**
```
이름: toy-backend-tg
프로토콜: HTTP
포트: 30400
대상 유형: 인스턴스
대상: worker 노드
헬스체크 경로: /health
```

**3. ALB:4000 리스너를 toy-backend-tg로 연결**

**4. 보안그룹 인바운드 추가**
| 보안그룹 | 포트 | 소스 |
|---|---|---|
| toy-alb-sg | 4000 TCP | 0.0.0.0/0 |
| toy-worker-sg | 30400 TCP | 0.0.0.0/0 |

**5. 프론트엔드 WebSocket URL 수정 후 재빌드**
```bash
docker build --no-cache \
  --build-arg "REACT_APP_WS_URL=ws://<ALB_DNS>:4000" \
  --build-arg "REACT_APP_API_URL=http://<ALB_DNS>" \
  -t <ECR_URI>/toy/k8s/front:latest \
  ./frontend

docker push <ECR_URI>/toy/k8s/front:latest
kubectl rollout restart deployment galaga-frontend -n galaga
```

---

## 최종 트래픽 흐름

```
사용자
  → ALB:80  → Ingress Controller (NodePort 32390)
                  ├── /api  → Backend Pod (REST API)
                  └── /     → Frontend Pod
  → ALB:4000 → Backend Pod (NodePort 30400) ← WebSocket 전용
                  └── RDS MySQL
```
