export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      billiards_assignments: {
        Row: {
          assignment_type: string
          ball_numbers: number[]
          created_at: string
          id: string
          match_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          assignment_type: string
          ball_numbers?: number[]
          created_at?: string
          id?: string
          match_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          ball_numbers?: number[]
          created_at?: string
          id?: string
          match_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billiards_assignments_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billiards_assignments_team_id_match_id_fkey"
            columns: ["team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      billiards_ball_states: {
        Row: {
          assignment_team_id: string | null
          ball_number: number
          match_id: string
          pocketed_by_participant_id: string | null
          pocketed_order: number | null
          state: string
          updated_at: string
        }
        Insert: {
          assignment_team_id?: string | null
          ball_number: number
          match_id: string
          pocketed_by_participant_id?: string | null
          pocketed_order?: number | null
          state?: string
          updated_at?: string
        }
        Update: {
          assignment_team_id?: string | null
          ball_number?: number
          match_id?: string
          pocketed_by_participant_id?: string | null
          pocketed_order?: number | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billiards_ball_states_assignment_team_id_match_id_fkey"
            columns: ["assignment_team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "billiards_ball_states_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billiards_ball_states_pocketed_by_participant_id_match_id_fkey"
            columns: ["pocketed_by_participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      billiards_events: {
        Row: {
          actor_profile_id: string | null
          ball_number: number | null
          client_event_id: string
          created_at: string
          event_id: string
          event_type: string
          id: number
          match_id: string
          payload: Json
          sequence: number
          turn_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          ball_number?: number | null
          client_event_id: string
          created_at?: string
          event_id?: string
          event_type: string
          id?: never
          match_id: string
          payload?: Json
          sequence: number
          turn_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          ball_number?: number | null
          client_event_id?: string
          created_at?: string
          event_id?: string
          event_type?: string
          id?: never
          match_id?: string
          payload?: Json
          sequence?: number
          turn_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billiards_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billiards_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billiards_events_turn_id_fkey"
            columns: ["turn_id"]
            isOneToOne: false
            referencedRelation: "billiards_turns"
            referencedColumns: ["id"]
          },
        ]
      }
      billiards_match_state: {
        Row: {
          active_participant_id: string | null
          active_team_id: string | null
          match_id: string
          mode: string
          phase: string
          updated_at: string
          version: number
        }
        Insert: {
          active_participant_id?: string | null
          active_team_id?: string | null
          match_id: string
          mode: string
          phase?: string
          updated_at?: string
          version?: number
        }
        Update: {
          active_participant_id?: string | null
          active_team_id?: string | null
          match_id?: string
          mode?: string
          phase?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "billiards_match_state_active_participant_id_match_id_fkey"
            columns: ["active_participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "billiards_match_state_active_team_id_match_id_fkey"
            columns: ["active_team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "billiards_match_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      billiards_turns: {
        Row: {
          ended_at: string | null
          id: string
          match_id: string
          participant_id: string | null
          started_at: string
          status: string
          team_id: string | null
          turn_number: number
        }
        Insert: {
          ended_at?: string | null
          id?: string
          match_id: string
          participant_id?: string | null
          started_at?: string
          status?: string
          team_id?: string | null
          turn_number: number
        }
        Update: {
          ended_at?: string | null
          id?: string
          match_id?: string
          participant_id?: string | null
          started_at?: string
          status?: string
          team_id?: string | null
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "billiards_turns_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billiards_turns_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "billiards_turns_team_id_match_id_fkey"
            columns: ["team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      flip7_card_definitions: {
        Row: {
          card_kind: string
          code: string
          copies: number
          display_order: number
          numeric_value: number | null
        }
        Insert: {
          card_kind: string
          code: string
          copies: number
          display_order: number
          numeric_value?: number | null
        }
        Update: {
          card_kind?: string
          code?: string
          copies?: number
          display_order?: number
          numeric_value?: number | null
        }
        Relationships: []
      }
      flip7_round_cards: {
        Row: {
          card_code: string
          created_at: string
          entry_order: number
          id: string
          is_active: boolean
          match_id: string
          participant_id: string
          round_id: string
        }
        Insert: {
          card_code: string
          created_at?: string
          entry_order: number
          id?: string
          is_active?: boolean
          match_id: string
          participant_id: string
          round_id: string
        }
        Update: {
          card_code?: string
          created_at?: string
          entry_order?: number
          id?: string
          is_active?: boolean
          match_id?: string
          participant_id?: string
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flip7_round_cards_card_code_fkey"
            columns: ["card_code"]
            isOneToOne: false
            referencedRelation: "flip7_card_definitions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "flip7_round_cards_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flip7_round_cards_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "flip7_round_cards_round_id_match_id_fkey"
            columns: ["round_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      flip7_round_player_state: {
        Row: {
          additive_points: number
          busted: boolean
          calculated_points: number
          finalized_at: string | null
          has_multiplier: boolean
          input_version: number
          match_id: string
          number_card_count: number
          participant_id: string
          round_id: string
          status: string
          updated_at: string
        }
        Insert: {
          additive_points?: number
          busted?: boolean
          calculated_points?: number
          finalized_at?: string | null
          has_multiplier?: boolean
          input_version?: number
          match_id: string
          number_card_count?: number
          participant_id: string
          round_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          additive_points?: number
          busted?: boolean
          calculated_points?: number
          finalized_at?: string | null
          has_multiplier?: boolean
          input_version?: number
          match_id?: string
          number_card_count?: number
          participant_id?: string
          round_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flip7_round_player_state_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flip7_round_player_state_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "flip7_round_player_state_round_id_match_id_fkey"
            columns: ["round_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      game_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      game_variants: {
        Row: {
          config: Json
          created_at: string
          game_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          game_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          game_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_variants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          allows_teams: boolean
          category_id: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_players: number | null
          max_winners: number
          min_players: number
          min_winners: number
          name: string
          scoring_model: string
          slug: string
          theme_key: string
          updated_at: string
        }
        Insert: {
          allows_teams?: boolean
          category_id: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_players?: number | null
          max_winners?: number
          min_players?: number
          min_winners?: number
          name: string
          scoring_model: string
          slug: string
          theme_key: string
          updated_at?: string
        }
        Update: {
          allows_teams?: boolean
          category_id?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_players?: number | null
          max_winners?: number
          min_players?: number
          min_winners?: number
          name?: string
          scoring_model?: string
          slug?: string
          theme_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "game_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          created_at: string
          group_id: string
          joined_at: string | null
          left_at: string | null
          profile_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          joined_at?: string | null
          left_at?: string | null
          profile_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          joined_at?: string | null
          left_at?: string | null
          profile_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by_profile_id: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          actor_profile_id: string | null
          base_version: number
          client_event_id: string
          created_at: string
          event_id: string
          event_type: string
          id: number
          match_id: string
          payload: Json
          result_version: number
          sequence: number
        }
        Insert: {
          actor_profile_id?: string | null
          base_version: number
          client_event_id: string
          created_at?: string
          event_id?: string
          event_type: string
          id?: never
          match_id: string
          payload?: Json
          result_version: number
          sequence: number
        }
        Update: {
          actor_profile_id?: string | null
          base_version?: number
          client_event_id?: string
          created_at?: string
          event_id?: string
          event_type?: string
          id?: never
          match_id?: string
          payload?: Json
          result_version?: number
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          created_at: string
          id: string
          match_id: string
          profile_id: string
          seat_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          profile_id: string
          seat_order: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          profile_id?: string
          seat_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          id: string
          match_id: string
          outcome: string
          placement: number | null
          recorded_by_profile_id: string | null
          revision: number
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          outcome: string
          placement?: number | null
          recorded_by_profile_id?: string | null
          revision?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          outcome?: string
          placement?: number | null
          recorded_by_profile_id?: string | null
          revision?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_recorded_by_profile_id_fkey"
            columns: ["recorded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_team_id_match_id_fkey"
            columns: ["team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      match_rounds: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          match_id: string
          revision: number
          round_number: number
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          match_id: string
          revision?: number
          round_number: number
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          match_id?: string
          revision?: number
          round_number?: number
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_rounds_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          last_round_id: string | null
          match_id: string
          participant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          last_round_id?: string | null
          match_id: string
          participant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          last_round_id?: string | null
          match_id?: string
          participant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_last_round_id_match_id_fkey"
            columns: ["last_round_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      match_team_members: {
        Row: {
          created_at: string
          match_id: string
          participant_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          match_id: string
          participant_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          match_id?: string
          participant_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_team_members_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_team_members_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "match_team_members_team_id_match_id_fkey"
            columns: ["team_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
      match_teams: {
        Row: {
          created_at: string
          id: string
          match_id: string
          name: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          name?: string | null
          position: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          name?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_teams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          archived_at: string | null
          archived_by_profile_id: string | null
          completed_at: string | null
          created_at: string
          created_by_profile_id: string
          game_id: string
          group_id: string
          id: string
          notes: string | null
          rules_revision_id: string | null
          scoring_engine_version: string
          scoring_model_snapshot: string
          settings: Json
          started_at: string | null
          status: string
          updated_at: string
          variant_id: string | null
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_profile_id: string
          game_id: string
          group_id: string
          id?: string
          notes?: string | null
          rules_revision_id?: string | null
          scoring_engine_version?: string
          scoring_model_snapshot: string
          settings?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          variant_id?: string | null
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_profile_id?: string
          game_id?: string
          group_id?: string
          id?: string
          notes?: string | null
          rules_revision_id?: string | null
          scoring_engine_version?: string
          scoring_model_snapshot?: string
          settings?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          variant_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_archived_by_profile_id_fkey"
            columns: ["archived_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_rules_revision_id_fkey"
            columns: ["rules_revision_id"]
            isOneToOne: false
            referencedRelation: "rule_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_variant_game_fk"
            columns: ["variant_id", "game_id"]
            isOneToOne: false
            referencedRelation: "game_variants"
            referencedColumns: ["id", "game_id"]
          },
        ]
      }
      profile_preferences: {
        Row: {
          last_group_id: string | null
          profile_id: string
          reduced_motion_override: boolean | null
          theme_mode: string
          updated_at: string
        }
        Insert: {
          last_group_id?: string | null
          profile_id: string
          reduced_motion_override?: boolean | null
          theme_mode?: string
          updated_at?: string
        }
        Update: {
          last_group_id?: string | null
          profile_id?: string
          reduced_motion_override?: boolean | null
          theme_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_path?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rule_documents: {
        Row: {
          created_at: string
          game_id: string
          id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_documents_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_documents_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "game_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_revisions: {
        Row: {
          created_at: string
          description: string
          document_id: string
          id: string
          objective: string
          published_at: string | null
          scoring_rules: string
          setup: string
          source_url: string | null
          special_rules: Json
          status: string
          updated_at: string
          updated_by_profile_id: string | null
          version: number
          winning_conditions: string
        }
        Insert: {
          created_at?: string
          description?: string
          document_id: string
          id?: string
          objective?: string
          published_at?: string | null
          scoring_rules?: string
          setup?: string
          source_url?: string | null
          special_rules?: Json
          status: string
          updated_at?: string
          updated_by_profile_id?: string | null
          version: number
          winning_conditions?: string
        }
        Update: {
          created_at?: string
          description?: string
          document_id?: string
          id?: string
          objective?: string
          published_at?: string | null
          scoring_rules?: string
          setup?: string
          source_url?: string | null
          special_rules?: Json
          status?: string
          updated_at?: string
          updated_by_profile_id?: string | null
          version?: number
          winning_conditions?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_revisions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "rule_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_revisions_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      score_events: {
        Row: {
          actor_profile_id: string | null
          client_event_id: string
          created_at: string
          delta: number
          event_id: string
          event_kind: string
          id: number
          match_id: string
          participant_id: string
          reversal_of_id: number | null
          round_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          client_event_id: string
          created_at?: string
          delta: number
          event_id?: string
          event_kind: string
          id?: never
          match_id: string
          participant_id: string
          reversal_of_id?: number | null
          round_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          client_event_id?: string
          created_at?: string
          delta?: number
          event_id?: string
          event_kind?: string
          id?: never
          match_id?: string
          participant_id?: string
          reversal_of_id?: number | null
          round_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_participant_id_match_id_fkey"
            columns: ["participant_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id", "match_id"]
          },
          {
            foreignKeyName: "score_events_reversal_of_id_fkey"
            columns: ["reversal_of_id"]
            isOneToOne: false
            referencedRelation: "score_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_events_round_id_match_id_fkey"
            columns: ["round_id", "match_id"]
            isOneToOne: false
            referencedRelation: "match_rounds"
            referencedColumns: ["id", "match_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_match: {
        Args: {
          p_game_id: string
          p_group_id: string
          p_notes?: string
          p_participant_profile_ids: string[]
          p_variant_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
