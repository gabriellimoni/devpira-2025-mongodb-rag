import { IsString, IsNotEmpty } from 'class-validator';

export class EditConversationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
