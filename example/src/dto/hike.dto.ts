export class HikeDto {
  id: number;
  name: string;
  distanceKm: number;
  elevationGain: number;
  companion: string;
  wasSunny: boolean;

  constructor(partial: Partial<HikeDto>) {
    Object.assign(this, partial);
  }
}
