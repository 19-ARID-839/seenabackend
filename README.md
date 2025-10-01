# NestJS School Backend (Updated Starter)

This updated starter includes improved Auth that links Users with Institutes.

What's new:
- Director signup auto-creates an Institute (with generated code).
- Other roles must provide a valid instituteCode.
- Uses bcryptjs to avoid native build issues.
- Includes InstitutesService with create/findByCode.
- Updated package.json pinned to Nest v10 and platform-express v10.

## Quick start

1. Install dependencies:
```bash
npm install
```

2. Start with Docker Compose (starts MongoDB and builds the app):
```bash
docker-compose up --build
```

3. Or run locally (you need MongoDB running locally or change MONGO_URI):
```bash
npm run start:dev
```

4. Seed sample data:
```bash
npm run seed
```
