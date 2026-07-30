import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { ContractsService } from './contracts.service';
import { CreateContractTemplateDto, CreateContractVersionDto, UpsertContractClauseDto } from './dto/contract-engine.dto';

/**
 * Authenticated endpoints of the contract intelligence & document assembly
 * engine (#38): document assembly, template/version browsing + management,
 * clause library, and version diffing. Kept in a separate controller from
 * `ContractsController` (#39), which is `@Public()` for the glossary/reader
 * routes and must stay that way.
 *
 * Route ordering matters: `versions/diff` is declared before `versions/:versionId`
 * so a literal "diff" segment isn't swallowed by the dynamic route.
 */
@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard)
export class ContractEngineController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('templates')
  listTemplates(@Query('country') country?: string) {
    return this.contracts.listTemplates(country);
  }

  @Post('templates')
  @Roles('tse', 'admin')
  createTemplate(@Body() body: CreateContractTemplateDto) {
    return this.contracts.createTemplate(body);
  }

  @Get('templates/:id/versions')
  listVersions(@Param('id') id: string) {
    return this.contracts.listVersions(id);
  }

  @Post('templates/:id/versions')
  @Roles('tse', 'admin')
  createVersion(@Param('id') id: string, @Body() body: CreateContractVersionDto, @CurrentUser() user: any) {
    return this.contracts.createVersion(id, body, user.id);
  }

  @Get('versions/diff')
  diffVersions(@Query('from') from: string, @Query('to') to: string) {
    return this.contracts.diffVersions(from, to);
  }

  @Get('versions/:versionId')
  getVersion(@Param('versionId') versionId: string) {
    return this.contracts.getVersionDetail(versionId);
  }

  @Patch('versions/:versionId/publish')
  @Roles('tse', 'admin')
  publishVersion(@Param('versionId') versionId: string) {
    return this.contracts.publishVersion(versionId);
  }

  @Get('clauses')
  listClauses(@Query('category') category?: string) {
    return this.contracts.listClauses(category);
  }

  @Post('clauses')
  @Roles('tse', 'admin')
  upsertClause(@Body() body: UpsertContractClauseDto) {
    return this.contracts.upsertClause(body);
  }

  @Get(':bondId/document')
  getDocument(@Param('bondId') bondId: string, @Query('versionId') versionId?: string) {
    return this.contracts.getDocument(bondId, versionId);
  }
}
