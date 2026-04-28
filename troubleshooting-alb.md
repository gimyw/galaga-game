# Galaga K8s ALB 연결 트러블슈팅

---

## 1. Ingress Controller 미설치

**증상**
```
kubectl get ingress -n galaga
# ADDRESS 비어있음
```

**원인**
Ingress Controller가 설치되지 않아 Ingress 리소스가 동작하지 않음

**해결**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
kubectl get pod -n ingress-nginx
```

---

## 2. Ingress host 설정으로 인한 404

**증상**
ALB → worker 노드 32390 접속 시 404 응답
대상 그룹 헬스체크 실패 `Health checks failed with these codes: [404]`

**원인**
`ingress.yaml`에 `host: galaga.example.com`이 설정되어 있어 IP나 ALB DNS로 접속 시 매칭되지 않음

**해결**
`ingress.yaml`에서 host 제거
```yaml
# 변경 전
rules:
  - host: galaga.example.com
    http:

# 변경 후
rules:
  - http:
```

```bash
kubectl apply -f k8s/ingress.yaml
```

---

## 3. Ingress apply 시 webhook 타임아웃

**증상**
```
failed calling webhook "validate.nginx.ingress.kubernetes.io": 
failed to call webhook: Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/...": 
context deadline exceeded
```

**원인**
Ingress nginx 설치 시 등록된 admission webhook이 응답하지 못함

**해결**
```bash
kubectl delete validatingwebhookconfiguration ingress-nginx-admission
kubectl apply -f k8s/ingress.yaml
```

---

## 4. ALB 접속 타임아웃 (미해결)

**증상**
```
ERR_CONNECTION_TIMED_OUT
http://toy-alb-529248580.ap-northeast-2.elb.amazonaws.com 접속 불가
IP 직접 접속(13.125.190.98, 43.200.11.130)도 타임아웃
```

**확인된 사항**
| 항목 | 상태 |
|---|---|
| ALB 상태 | Active |
| ALB 서브넷 | pub-sub1/2/3 (IGW 라우팅 있음) |
| ALB 보안그룹(toy-alb-sg) | 80 TCP 0.0.0.0/0 열림 |
| 대상 그룹(toy-pri-tg) | worker1 32390 Healthy |
| Worker 보안그룹(toy-worker-sg) | 32390 TCP 열림 |
| Ingress Controller | Running |
| DNS 조회 | 정상 (IP 반환됨) |

**미확인 사항 (추가 점검 필요)**
- ALB → worker 노드 간 보안그룹 규칙 (toy-alb-sg → toy-worker-sg 32390)
- NACL 인바운드/아웃바운드 규칙
- pub-sub 라우팅 테이블 IGW 연결 실제 적용 여부
- worker 노드에서 32390 포트 실제 Listen 여부

**추가 점검 명령어**
```bash
# worker 노드에서 32390 포트 Listen 확인
ss -tlnp | grep 32390

# ALB에서 worker로 직접 통신 테스트
curl http://<worker-private-ip>:32390
```
