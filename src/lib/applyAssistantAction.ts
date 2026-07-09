import { supabase } from './supabase'
import { geocodeLocation } from './geoapify'
import { regenerateSingleDay } from './itineraryGenerator'
import type { AssistantAction } from './tripAssistant'
import type { Trip, Stop, Day } from './types'

export class ApplyActionError extends Error {}

/**
 * Performs the actual database write for an approved assistant action.
 * Deliberately the ONLY place that turns an assistant proposal into a real
 * change — the AI layer (tripAssistant.ts) never touches Supabase directly.
 * Called only after the user has explicitly approved the proposed diff.
 */
export async function applyAssistantAction(
  trip: Trip,
  action: AssistantAction,
  days: (Day & { stops: Stop[] })[]
): Promise<void> {
  switch (action.type) {
    case 'move_time': {
      if (!action.stop_id || !action.new_time) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const { error } = await supabase.from('stops').update({ start_time: action.new_time }).eq('id', action.stop_id)
      if (error) throw new ApplyActionError('Could not update the time.')
      return
    }

    case 'change_cost': {
      if (!action.stop_id || action.new_cost === undefined) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const { error } = await supabase.from('stops').update({ est_cost: action.new_cost }).eq('id', action.stop_id)
      if (error) throw new ApplyActionError('Could not update the cost.')
      return
    }

    case 'remove_stop': {
      if (!action.stop_id) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const { error } = await supabase.from('stops').delete().eq('id', action.stop_id)
      if (error) throw new ApplyActionError('Could not remove the stop.')
      return
    }

    case 'reorder_stop': {
      if (!action.stop_id || !action.day_id || action.new_position === undefined) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const day = days.find((d) => d.id === action.day_id)
      if (!day) throw new ApplyActionError('Could not find that day.')

      const stops = [...day.stops].sort((a, b) => a.order_index - b.order_index)
      const fromIndex = stops.findIndex((s) => s.id === action.stop_id)
      if (fromIndex === -1) throw new ApplyActionError('Could not find that stop.')

      const [moved] = stops.splice(fromIndex, 1)
      const clampedPosition = Math.max(0, Math.min(action.new_position, stops.length))
      stops.splice(clampedPosition, 0, moved)

      await Promise.all(
        stops.map((s, index) => supabase.from('stops').update({ order_index: index }).eq('id', s.id))
      )
      return
    }

    case 'add_stop': {
      if (!action.day_id || !action.new_stop_name || !action.new_stop_type) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const day = days.find((d) => d.id === action.day_id)
      const orderIndex = day ? day.stops.length : 0
      const geo = await geocodeLocation(action.new_stop_name)

      const { error } = await supabase.from('stops').insert({
        day_id: action.day_id,
        order_index: orderIndex,
        type: action.new_stop_type,
        name: action.new_stop_name,
        start_time: action.new_time ?? null,
        est_cost: action.new_cost ?? null,
        notes: null,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        geocode_status: geo && geo.confidence >= 0.4 ? 'resolved' : 'unresolved',
      })
      if (error) throw new ApplyActionError('Could not add the stop.')
      return
    }

    case 'regenerate_day': {
      if (!action.day_id) {
        throw new ApplyActionError('Missing details for this change.')
      }
      try {
        await regenerateSingleDay(trip, action.day_id)
      } catch {
        throw new ApplyActionError('Could not regenerate that day.')
      }
      return
    }

    case 'add_note': {
      if (action.note_content === undefined) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const dayId = action.note_day_id ?? null
      const query = supabase.from('notes').select('id').eq('trip_id', trip.id)
      const { data: existing } = await (dayId === null ? query.is('day_id', null) : query.eq('day_id', dayId)).maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('notes')
          .update({ content: action.note_content, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw new ApplyActionError('Could not save the note.')
      } else {
        const { error } = await supabase
          .from('notes')
          .insert({ trip_id: trip.id, day_id: dayId, content: action.note_content })
        if (error) throw new ApplyActionError('Could not save the note.')
      }
      return
    }

    case 'add_packing_item': {
      if (!action.packing_item_label) {
        throw new ApplyActionError('Missing details for this change.')
      }
      const { error } = await supabase
        .from('packing_items')
        .insert({ trip_id: trip.id, label: action.packing_item_label, category: 'general' })
      if (error) throw new ApplyActionError('Could not add the packing item.')
      return
    }

    default:
      throw new ApplyActionError('This action cannot be applied.')
  }
}
