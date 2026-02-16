import { Module } from '@nestjs/common';
import { ToonModule } from 'nestjs-toon';
import { AppController } from './app.controller';

@Module({
  imports: [
    ToonModule.forRoot({
      global: true,
      enableResponseSerialization: true,
      errorHandling: 'log-and-fallback',
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
