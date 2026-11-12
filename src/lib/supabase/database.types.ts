type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      booking_admins: Table<{ email: string }, { email: string }>;
      weekly_hours: Table<
        {
          weekday: number;
          is_open: boolean;
          opens_at: string | null;
          closes_at: string | null;
        },
        {
          weekday: number;
          is_open?: boolean;
          opens_at?: string | null;
          closes_at?: string | null;
        }
      >;
      service_catalog: Table<
        {
          id: string;
          name: string;
          price: number | null;
          description: string;
          duration_minutes: number | null;
          active: boolean;
          sort_order: number;
        },
        {
          id: string;
          name: string;
          price?: number | null;
          description?: string;
          duration_minutes?: number | null;
          active?: boolean;
          sort_order?: number;
        }
      >;
      bookings: Table<
        {
          id: string;
          customer_name: string;
          email: string;
          phone: string;
          vehicle: string;
          service_location: string | null;
          service_id: string;
          preferred_date: string;
          preferred_time: string;
          start_at: string | null;
          end_at: string | null;
          notes: string | null;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          created_at: string;
        },
        {
          id?: string;
          customer_name: string;
          email: string;
          phone: string;
          vehicle: string;
          service_location?: string | null;
          service_id: string;
          preferred_date: string;
          preferred_time: string;
          start_at?: string | null;
          end_at?: string | null;
          notes?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      get_available_slots: {
        Args: { p_date: string; p_service_id: string };
        Returns: { slot_time: string }[];
      };
      is_booking_admin: { Args: Record<never, never>; Returns: boolean };
      request_booking: {
        Args: {
          p_customer_name: string;
          p_email: string;
          p_phone: string;
          p_vehicle: string;
          p_service_location: string;
          p_service_id: string;
          p_date: string;
          p_time: string;
          p_notes?: string | null;
        };
        Returns: string;
      };
      update_booking_settings: {
        Args: { p_weekly_hours: unknown; p_service_durations: unknown };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
