import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for testing
  app.enableCors();

  await app.listen(3000);

  console.log('Example app running on http://localhost:3000');
  console.log('\nTry these commands:');
  console.log('  curl -H "Accept: text/toon" http://localhost:3000/api/hikes');
  console.log('  curl -H "Accept: application/json" http://localhost:3000/api/hikes');
  console.log('  curl -H "Accept: text/toon" http://localhost:3000/api/users');
  console.log('  curl -H "Accept: text/toon" http://localhost:3000/api/mixed');
}

bootstrap();
