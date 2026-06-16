import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.notifications.list(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notifications.markRead(id, user.id);
  }
}
