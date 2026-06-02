import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class PartiesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data } = await this.supabase.admin
      .from('parties').select('*').order('name');
    return data ?? [];
  }

  async findOne(id: string) {
    const { data } = await this.supabase.admin
      .from('parties').select('*').eq('id', id).single();
    return data;
  }

  async create(body: { code: string; name: string }) {
    const { data, error } = await this.supabase.admin
      .from('parties').insert(body).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
}
