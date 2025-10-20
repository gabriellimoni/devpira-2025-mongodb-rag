import { IsString, IsNotEmpty } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  sender: string;
}
