import { createNestExpressApp } from './bootstrap';

async function bootstrap() {
  const app = await createNestExpressApp();
  const port = process.env.PORT ?? 3001;
  app.listen(port, () => {
    console.log(`VELAR API running on http://localhost:${port}/api`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Swagger docs on http://localhost:${port}/api/docs`);
    }
  });
}
bootstrap();
