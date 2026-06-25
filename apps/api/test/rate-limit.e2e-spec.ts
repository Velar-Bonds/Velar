import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SupabaseService } from './../src/common/supabase/supabase.service';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  async function createApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getUser: jest.fn(),
        admin: {
          auth: {
            signInWithPassword: jest.fn().mockResolvedValue({
              data: { session: null, user: null },
              error: { message: 'Invalid login credentials' },
            }),
          },
          from: jest.fn(),
        },
      })
      .compile();

    const nestApp = moduleFixture.createNestApplication<NestExpressApplication>();
    nestApp.set('trust proxy', 1);
    nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    nestApp.setGlobalPrefix('api');
    await nestApp.init();

    return nestApp;
  }

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows normal requests to the default endpoint', async () => {
    await request(app.getHttpServer()).get('/api').expect(200);
  });

  it('blocks the 101st request to a default endpoint and returns Retry-After', async () => {
    for (let i = 0; i < 100; i += 1) {
      await request(app.getHttpServer()).get('/api').expect(200);
    }

    const response = await request(app.getHttpServer()).get('/api').expect(429);
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('blocks the 21st unauthenticated POST /bonds request before auth handling', async () => {
    for (let i = 0; i < 20; i += 1) {
      await request(app.getHttpServer()).post('/api/bonds').send({}).expect(401);
    }

    const response = await request(app.getHttpServer()).post('/api/bonds').send({}).expect(429);
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('blocks the 11th POST /auth/login request', async () => {
    const credentials = {
      email: 'missing@example.com',
      password: 'wrong-password',
    };

    for (let i = 0; i < 10; i += 1) {
      await request(app.getHttpServer()).post('/api/auth/login').send(credentials).expect(401);
    }

    const response = await request(app.getHttpServer()).post('/api/auth/login').send(credentials).expect(429);
    expect(response.headers['retry-after']).toBeDefined();
  });
});
