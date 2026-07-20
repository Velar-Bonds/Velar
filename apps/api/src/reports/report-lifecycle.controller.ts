import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportLifecycleService } from './report-lifecycle.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@velar/types';
import { AddLineItemDto, CreateDraftDto } from './dto/report-lifecycle.dto';

/**
 * API del ciclo de vida estructurado del reporte del partido. Convive con
 * ReportsController (metadata legacy) bajo el sub-path `reports/lifecycle`.
 */
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports/lifecycle')
@UseGuards(AuthGuard)
export class ReportLifecycleController {
  constructor(private lifecycle: ReportLifecycleService) {}

  @Post()
  @Roles('emisor')
  createDraft(@Body() body: CreateDraftDto, @CurrentUser() user: any) {
    return this.lifecycle.createDraft(
      body,
      user.id,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lifecycle.getDetail(id, user.profile?.party_id ?? null, user.profile?.role as Role);
  }

  @Get(':id/line-items')
  listLineItems(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lifecycle.listLineItems(
      id,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Post(':id/line-items')
  @Roles('emisor')
  addLineItem(@Param('id') id: string, @Body() body: AddLineItemDto, @CurrentUser() user: any) {
    return this.lifecycle.addLineItem(
      id,
      body,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Delete(':id/line-items/:lineItemId')
  @Roles('emisor')
  removeLineItem(
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @CurrentUser() user: any,
  ) {
    return this.lifecycle.removeLineItem(
      id,
      lineItemId,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Get(':id/reconciliation')
  reconcile(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lifecycle.previewReconciliation(
      id,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Post(':id/files')
  @Roles('emisor')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('Archivo requerido');
    return this.lifecycle.uploadFile(
      id,
      { fileName: file.originalname, mimeType: file.mimetype, buffer: file.buffer },
      user.id,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }

  @Post(':id/submit')
  @Roles('emisor')
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.lifecycle.submit(
      id,
      user.id,
      user.profile?.party_id ?? null,
      user.profile?.role as Role,
    );
  }
}
