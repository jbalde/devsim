import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from '@devsim/shared';

@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  get(): Company {
    return this.companyService.get();
  }

  @Patch()
  update(@Body() body: Partial<Company>): Company {
    return this.companyService.update(body);
  }
}
