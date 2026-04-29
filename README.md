# 🚀 Galaga Game - 3 Tier Architecture

React (Web) + Node.js/WebSocket (App) + MySQL RDS (DB)  
Self-managed Kubernetes on AWS

---

## 아키텍처

```
[Browser]
  → ALB:80  → Nginx Ingress (NodePort 32390)
                  ├── /api  → Backend Pod (REST API)
                  └── /     → Frontend Pod (React)
  → ALB:4000 → Backend Pod (NodePort 30400) ← WebSocket 전용
                  └── RDS MySQL (galaga_db)
```

### AWS 인프라
- **VPC**: toy-vpc (10.10.0.0/16) / ap-northeast-2a
- **Public Subnet**: ALB, NAT Gateway
- **Private Subnet**: K8s master(toy-vpc-master1), worker(toy-vpc-worker1)
- **DB Subnet**: RDS MySQL 8.0
- **ECR**: toy/k8s/front, toy/k8s/back

---

## 로컬 실행 (Docker Compose)

```bash
cd galaga-game
docker-compose up --build
```

- 게임: http://localhost:3000
- API: http://localhost:4000/api/scores

---

## 로컬 개발 (직접 실행)

**Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
REACT_APP_WS_URL=ws://localhost:4000 \
REACT_APP_API_URL=http://localhost:4000 \
npm start
```

---

## AWS 배포

### 1. ECR 로그인
```bash
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 2. 이미지 빌드 & 푸시
```bash
# Backend
docker build -t <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/toy/k8s/back:latest ./backend
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/toy/k8s/back:latest

# Frontend (ALB DNS 주소로 환경변수 설정)
docker build --no-cache \
  --build-arg "REACT_APP_WS_URL=ws://<ALB_DNS>:4000" \
  --build-arg "REACT_APP_API_URL=http://<ALB_DNS>" \
  -t <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/toy/k8s/front:latest \
  ./frontend
docker push <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/toy/k8s/front:latest
```

### 3. K8s 배포 (master 노드에서)
```bash
# ECR Secret 생성
kubectl create secret docker-registry ecr-secret \
  --docker-server=<account-id>.dkr.ecr.ap-northeast-2.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region ap-northeast-2) \
  --namespace=galaga

# DB Secret 생성
cp k8s/db-secret.yaml.example k8s/db-secret.yaml
# db-secret.yaml에 RDS 접속 정보 입력 후
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/db-secret.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# 상태 확인
kubectl get all -n galaga
```

---

## 게임 조작

| 키 | 동작 |
|---|---|
| ← → / A D | 이동 |
| Space | 발사 |

---

## DB 스키마

```sql
-- 점수 기록
scores (id, name, score, created_at)

-- 유저 최고 기록
users (id, name, best_score, play_count, updated_at)
```
