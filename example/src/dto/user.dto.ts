export class UserDto {
  id: number;
  name: string;
  email: string;
  age: number;
  active: boolean;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
