/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import { dbService, ensureValidUUID } from './db';
import { supabaseDbService } from './supabaseDb';
import { Routine, RoutineEntry } from '../types';

class DatabaseSeeder {
  /**
   * Internal verification to ensure user is authenticated as an administrator.
   */
  private async verifyAdminAuth(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      throw new Error('Unauthorized: User is not authenticated.');
    }
    const role = await supabaseDbService.getUserRole(session.user.id);
    if (role !== 'admin') {
      throw new Error('Unauthorized: Administrator privileges are required.');
    }
  }

  /**
   * Seed Routines from local cache to Supabase.
   */
  async seedRoutines(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      // 1. Verify authenticated admin
      await this.verifyAdminAuth();

      // 2. Query remote routines table
      const { data: remoteData, error: queryError } = await supabase
        .from('routines')
        .select('id');

      if (queryError) {
        throw new Error(`Seeding aborted: Unable to fetch remote routines (${queryError.message}).`);
      }

      if (remoteData && remoteData.length > 0) {
        return {
          success: false,
          message: `Already Seeded: Remote table already contains ${remoteData.length} routine record(s).`,
          count: remoteData.length
        };
      }

      // 3. Retrieve and validate local dataset
      const localRoutines = dbService.getRoutines();
      if (!localRoutines || localRoutines.length === 0) {
        throw new Error('Seeding aborted: No local routines found in cache.');
      }

      const validatedRoutines: Routine[] = [];
      for (const r of localRoutines) {
        if (!r.class_name) {
          throw new Error('Validation failed: A local routine is missing "class_name".');
        }
        if (r.display_mode !== 'online' && r.display_mode !== 'pdf') {
          throw new Error(`Validation failed: Invalid display_mode value in routine for class ${r.class_name}.`);
        }
        if (typeof r.override_active !== 'boolean') {
          throw new Error(`Validation failed: "override_active" must be a boolean in routine for class ${r.class_name}.`);
        }

        // Sanitize with ensureValidUUID
        const sanitizedId = ensureValidUUID(r.id);

        validatedRoutines.push({
          ...r,
          id: sanitizedId,
          created_at: r.created_at || new Date().toISOString(),
          updated_at: r.updated_at || new Date().toISOString()
        });
      }

      // 4. Perform upload upsert/insert
      const { error: insertError } = await supabase
        .from('routines')
        .insert(validatedRoutines);

      if (insertError) {
        throw new Error(`Seeding failed during upload: ${insertError.message}`);
      }

      console.log(`[DatabaseSeeder] Successfully seeded ${validatedRoutines.length} routines to remote.`);

      return {
        success: true,
        message: `Successfully seeded ${validatedRoutines.length} routine(s) to the remote database.`,
        count: validatedRoutines.length
      };

    } catch (error: any) {
      console.error('[DatabaseSeeder Error]', error.message || error);
      throw error;
    }
  }

  /**
   * Seed Routine Entries from local cache to Supabase.
   */
  async seedRoutineEntries(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      // 1. Verify authenticated admin
      await this.verifyAdminAuth();

      // 2. Query remote routine entries table
      const { data: remoteData, error: queryError } = await supabase
        .from('routine_entries')
        .select('id');

      if (queryError) {
        throw new Error(`Seeding aborted: Unable to fetch remote routine entries (${queryError.message}).`);
      }

      if (remoteData && remoteData.length > 0) {
        return {
          success: false,
          message: `Already Seeded: Remote table already contains ${remoteData.length} routine entry record(s).`,
          count: remoteData.length
        };
      }

      // 3. Retrieve local dataset
      const localEntries = dbService.getRoutineEntries();
      if (!localEntries || localEntries.length === 0) {
        throw new Error('Seeding aborted: No local routine entries found in cache.');
      }

      // Fetch remote routines to verify FK constraint
      const remoteRoutines = await supabaseDbService.getRoutines();
      const remoteRoutineIds = new Set(remoteRoutines.map(r => ensureValidUUID(r.id)));

      const validatedEntries = [];
      for (const entry of localEntries) {
        const sanitizedId = ensureValidUUID(entry.id);
        const sanitizedRoutineId = ensureValidUUID(entry.routine_id);

        // Check FK constraint
        if (!remoteRoutineIds.has(sanitizedRoutineId)) {
          throw new Error(`Foreign Key Mismatch: routine_id "${sanitizedRoutineId}" (from entry "${entry.id}") does not exist in remote "routines" table.`);
        }

        validatedEntries.push({
          id: sanitizedId,
          routine_id: sanitizedRoutineId,
          day: entry.day,
          period: entry.period,
          subject: entry.subject,
          teacher: entry.teacher || null,
          time_range: entry.time_range || null
        });
      }

      // 4. Perform upload insert/upsert
      const { error: insertError } = await supabase
        .from('routine_entries')
        .insert(validatedEntries);

      if (insertError) {
        throw new Error(`Seeding failed during upload: ${insertError.message}`);
      }

      console.log(`[ROUTINE ENTRIES SEEDED] Successfully seeded ${validatedEntries.length} routine entries.`);

      return {
        success: true,
        message: `Successfully seeded ${validatedEntries.length} routine entry/entries to the remote database.`,
        count: validatedEntries.length
      };

    } catch (error: any) {
      console.error('[DatabaseSeeder Error]', error.message || error);
      throw error;
    }
  }
}

export const databaseSeeder = new DatabaseSeeder();
