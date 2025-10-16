// main.ts

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for frontend requests
  app.enableCors({
    origin: "http://localhost:8080",
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  });

  app.setGlobalPrefix("api");
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("➡️ Request:", req.method, req.url);
  console.log("   Authorization:", req.headers.authorization || "❌ none");
  next();
});
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(
    `🚀 Server running on http://localhost:${port}/api, mongo detail: ${process.env.MONGO_URI}`
  );
  
}
bootstrap();
