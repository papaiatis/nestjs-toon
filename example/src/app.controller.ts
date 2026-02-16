import { Controller, Get } from '@nestjs/common';
import { HikeDto } from './dto/hike.dto';
import { UserDto } from './dto/user.dto';

@Controller('api')
export class AppController {
  @Get('hikes')
  getHikes(): { hikes: HikeDto[] } {
    return {
      hikes: [
        new HikeDto({
          id: 1,
          name: 'Blue Lake Trail',
          distanceKm: 7.5,
          elevationGain: 320,
          companion: 'ana',
          wasSunny: true,
        }),
        new HikeDto({
          id: 2,
          name: 'Ridge Overlook',
          distanceKm: 9.2,
          elevationGain: 540,
          companion: 'luis',
          wasSunny: false,
        }),
        new HikeDto({
          id: 3,
          name: 'Wildflower Loop',
          distanceKm: 5.1,
          elevationGain: 180,
          companion: 'sam',
          wasSunny: true,
        }),
      ],
    };
  }

  @Get('users')
  getUsers(): { users: UserDto[] } {
    return {
      users: Array.from({ length: 10 }, (_, i) =>
        new UserDto({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          age: 20 + i,
          active: i % 2 === 0,
        })
      ),
    };
  }

  @Get('mixed')
  getMixed() {
    return {
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        count: 42,
      },
      items: [
        { id: 1, label: 'Item A' },
        { id: 2, label: 'Item B' },
      ],
    };
  }
}
