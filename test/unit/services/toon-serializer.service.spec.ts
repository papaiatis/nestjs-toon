import { Test, TestingModule } from '@nestjs/testing';
import { ToonSerializerService } from '../../../src/services/toon-serializer.service';
import { ToonSerializationException } from '../../../src/exceptions/toon-serialization.exception';
import { ToonDeserializationException } from '../../../src/exceptions/toon-deserialization.exception';

describe('ToonSerializerService', () => {
  let service: ToonSerializerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToonSerializerService],
    }).compile();

    service = module.get<ToonSerializerService>(ToonSerializerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encode', () => {
    it('should encode a simple object to TOON', () => {
      const data = { name: 'Alice', age: 30 };
      const result = service.encode(data);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Alice');
      expect(result).toContain('30');
    });

    it('should encode an array of objects to TOON', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const result = service.encode(data);
      expect(result).toBeDefined();
      expect(result).toContain('users');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should encode null', () => {
      const result = service.encode(null);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should encode undefined', () => {
      const result = service.encode(undefined);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should encode nested objects', () => {
      const data = {
        user: {
          name: 'Alice',
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      };
      const result = service.encode(data);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Alice');
      expect(result).toContain('New York');
    });

    it('should throw ToonSerializationException on circular reference', () => {
      const data: any = { name: 'Alice' };
      data.self = data; // Create circular reference

      expect(() => service.encode(data)).toThrow(ToonSerializationException);
    });

    it('should encode class instances to TOON', () => {
      class UserDto {
        id: number;
        name: string;
        email: string;

        constructor(partial: Partial<UserDto>) {
          Object.assign(this, partial);
        }
      }

      const data = {
        users: [
          new UserDto({ id: 1, name: 'Alice', email: 'alice@example.com' }),
          new UserDto({ id: 2, name: 'Bob', email: 'bob@example.com' }),
        ],
      };

      const result = service.encode(data);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Should contain actual data, not null
      expect(result).toContain('users');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('alice@example.com');
    });

    it('should encode nested class instances', () => {
      class AddressDto {
        city: string;
        zip: string;

        constructor(partial: Partial<AddressDto>) {
          Object.assign(this, partial);
        }
      }

      class UserDto {
        id: number;
        name: string;
        address: AddressDto;

        constructor(partial: Partial<UserDto>) {
          Object.assign(this, partial);
        }
      }

      const data = {
        user: new UserDto({
          id: 1,
          name: 'Alice',
          address: new AddressDto({ city: 'New York', zip: '10001' }),
        }),
      };

      const result = service.encode(data);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Should contain actual data from nested class instances
      expect(result).toContain('Alice');
      expect(result).toContain('New York');
      expect(result).toContain('10001');
    });
  });

  describe('decode', () => {
    it('should decode TOON string to object', () => {
      const original = { name: 'Alice', age: 30 };
      const toonString = service.encode(original);
      const result = service.decode(toonString);

      expect(result).toEqual(original);
    });

    it('should decode array of objects from TOON', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const toonString = service.encode(original);
      const result = service.decode(toonString);

      expect(result).toHaveProperty('users');
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].name).toBe('Alice');
      expect(result.users[1].name).toBe('Bob');
    });

    it('should throw ToonDeserializationException for invalid input type', () => {
      expect(() => service.decode(123 as any)).toThrow(ToonDeserializationException);
    });

    it('should throw ToonDeserializationException for empty string', () => {
      expect(() => service.decode('')).toThrow(ToonDeserializationException);
    });

    it('should throw ToonDeserializationException for whitespace-only string', () => {
      expect(() => service.decode('   \n  ')).toThrow(ToonDeserializationException);
    });
  });

  describe('canSerialize', () => {
    it('should return true for serializable object', () => {
      const data = { name: 'Alice', age: 30 };
      expect(service.canSerialize(data)).toBe(true);
    });

    it('should return true for arrays', () => {
      const data = [1, 2, 3];
      expect(service.canSerialize(data)).toBe(true);
    });

    it('should return true for primitives', () => {
      expect(service.canSerialize('string')).toBe(true);
      expect(service.canSerialize(123)).toBe(true);
      expect(service.canSerialize(true)).toBe(true);
      expect(service.canSerialize(null)).toBe(true);
    });

    it('should return false for circular references', () => {
      const data: any = { name: 'Alice' };
      data.self = data;
      expect(service.canSerialize(data)).toBe(false);
    });
  });

  describe('round-trip encoding', () => {
    it('should successfully round-trip encode and decode', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
        ],
      };

      const encoded = service.encode(original);
      const decoded = service.decode(encoded);

      expect(decoded).toEqual(original);
    });
  });
});
