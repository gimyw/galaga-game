# 🚀 Galaga Game - 3 Tier Architecture

React (Web) + Node.js/WebSocket (App) + MySQL (DB)

## 로컬 실행 (Docker Compose)

```bash
cd galaga-game
docker-compose up --build
```

- 게임: http://localhost:3000
- API:  http://localhost:4000/api/scores

## 로컬 개발 (직접 실행)

**DB**
```bash
docker run -d --name galaga-mysql \
  -e MYSQL_ROOT_PASSWORD=root_pass \
  -e MYSQL_DATABASE=galaga_db \
  -e MYSQL_USER=galaga \
  -e MYSQL_PASSWORD=galaga_pass \
  -p 3306:3306 mysql:8.0
```

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

## Kubernetes 배포

```bash
# 이미지 빌드
docker build -t galaga-frontend:latest ./frontend
docker build -t galaga-backend:latest ./backend

# 배포
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/db-secret.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

# 상태 확인
kubectl get all -n galaga
```

## 아키텍처

```
[Browser] → [ALB] → [Nginx Ingress]
                         ├── /        → Frontend (React, port 80)
                         ├── /api     → Backend REST (Node.js, port 4000)
                         └── /ws      → Backend WebSocket (Node.js, port 4000)
                                            └── MySQL (Score/User DB, port 3306)
```

## 게임 조작

| 키 | 동작 |
|---|---|
| ← → / A D | 이동 |
| Space | 발사 |

## DB 스키마

```sql
-- 점수 기록
scores (id, name, score, created_at)

-- 유저 최고 기록
users (id, name, best_score, play_count, updated_at)
```
