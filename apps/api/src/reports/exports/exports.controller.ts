import { Controller, Get, StreamableFile, UseGuards } from '@nestjs/common';
import { Readable } from 'stream';
import { Role } from '@velar/types';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { streamDecisionsCsv } from './csv-export';
import { buildDecisionsPdf } from './pdf-export';
import { ExportsService } from './exports.service';

@Controller('reports/exports')
@UseGuards(AuthGuard)
export class ExportsController {
  constructor(private exports: ExportsService) {}

  @Get('decisions.csv')
  async decisionsCsv(@CurrentUser() user: any): Promise<StreamableFile> {
    const rows = await this.exports.getDecisionRows(user.profile?.role as Role);
    const now = new Date().toISOString();
    const readable = Readable.from(streamDecisionsCsv(rows, now));
    return new StreamableFile(readable, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="velar-decisions-${now.slice(0, 10)}.csv"`,
    });
  }

  @Get('decisions.pdf')
  async decisionsPdf(@CurrentUser() user: any): Promise<StreamableFile> {
    const rows = await this.exports.getDecisionRows(user.profile?.role as Role);
    const now = new Date().toISOString();
    const doc = buildDecisionsPdf(rows, now);
    // PDFDocument is a Readable at runtime; @types/pdfkit's stream typing
    // does not satisfy Nest's StreamableFile(Readable) overload.
    return new StreamableFile(doc as unknown as Readable, {
      type: 'application/pdf',
      disposition: `attachment; filename="velar-decisions-${now.slice(0, 10)}.pdf"`,
    });
  }
}
