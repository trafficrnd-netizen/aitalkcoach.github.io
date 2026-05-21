export type UserType = 'researcher' | 'supplier'
export type RequestType = 'single' | 'batch'
export type RequestStatus = 'open' | 'closed' | 'expired' | 'cancelled'
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type TransactionStatus = 'in_progress' | 'completed' | 'disputed'
export type SupplierPlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type MarketPriceSource = 'external' | 'supplier' | 'transaction'
export type ApiPlan = 'sandbox' | 'starter' | 'growth' | 'platform' | 'enterprise'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          type: UserType
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          type: UserType
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      researcher_profiles: {
        Row: {
          user_id: string
          name: string
          institution: string | null
          department: string | null
          phone: string | null
        }
        Insert: {
          user_id: string
          name: string
          institution?: string | null
          department?: string | null
          phone?: string | null
        }
        Update: Partial<Database['public']['Tables']['researcher_profiles']['Insert']>
      }
      supplier_profiles: {
        Row: {
          user_id: string
          company_name: string
          business_number: string
          verified_at: string | null
          representative: string | null
          address: string | null
          phone: string | null
          categories: string[]
          regions: string[]
          plan: SupplierPlan
          credits: number
          early_bird: boolean
          handles_hazmat: boolean
          hazmat_license_no: string | null
          contact_name: string | null
          contact_phone: string | null
          /** 'instant' | 'pending' | 'approved' | 'rejected' */
          verification_status: string
        }
        Insert: {
          user_id: string
          company_name: string
          business_number: string
          verified_at?: string | null
          representative?: string | null
          address?: string | null
          phone?: string | null
          categories?: string[]
          regions?: string[]
          plan?: SupplierPlan
          credits?: number
          early_bird?: boolean
          handles_hazmat?: boolean
          hazmat_license_no?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          verification_status?: string
        }
        Update: Partial<Database['public']['Tables']['supplier_profiles']['Insert']>
      }
      requests: {
        Row: {
          id: string
          researcher_id: string
          type: RequestType
          title: string | null
          status: RequestStatus
          deadline: string | null
          delivery_address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          researcher_id: string
          type: RequestType
          title?: string | null
          status?: RequestStatus
          deadline?: string | null
          delivery_address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['requests']['Insert']>
      }
      request_items: {
        Row: {
          id: string
          request_id: string
          substance_name: string
          cas_number: string | null
          purity: string | null
          volume: string | null
          qty: number
          unit: string | null
          note: string | null
        }
        Insert: {
          id?: string
          request_id: string
          substance_name: string
          cas_number?: string | null
          purity?: string | null
          volume?: string | null
          qty: number
          unit?: string | null
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['request_items']['Insert']>
      }
      bids: {
        Row: {
          id: string
          request_id: string
          supplier_id: string
          is_partial: boolean
          delivery_date: string | null
          valid_until: string | null
          memo: string | null
          status: BidStatus
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          supplier_id: string
          is_partial?: boolean
          delivery_date?: string | null
          valid_until?: string | null
          memo?: string | null
          status?: BidStatus
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['bids']['Insert']>
      }
      bid_items: {
        Row: {
          id: string
          bid_id: string
          request_item_id: string
          unit_price: number | null
          total_price: number | null
          available: boolean
        }
        Insert: {
          id?: string
          bid_id: string
          request_item_id: string
          unit_price?: number | null
          total_price?: number | null
          available?: boolean
        }
        Update: Partial<Database['public']['Tables']['bid_items']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          request_id: string
          bid_id: string
          status: TransactionStatus
          actual_delivery: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          request_id: string
          bid_id: string
          status?: TransactionStatus
          actual_delivery?: string | null
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          transaction_id: string
          reviewer_id: string
          reviewee_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          reviewer_id: string
          reviewee_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      market_prices: {
        Row: {
          id: string
          substance_name: string
          cas_number: string | null
          purity: string | null
          volume: string | null
          final_price: number
          source: MarketPriceSource
          recorded_at: string
        }
        Insert: {
          id?: string
          substance_name: string
          cas_number?: string | null
          purity?: string | null
          volume?: string | null
          final_price: number
          source: MarketPriceSource
          recorded_at?: string
        }
        Update: Partial<Database['public']['Tables']['market_prices']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Record<string, unknown>
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          payload?: Record<string, unknown>
          read_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      substance_cache: {
        Row: {
          cas_number: string
          names: string[]
          synonyms: string[]
          molecular_weight: number | null
          fetched_at: string
        }
        Insert: {
          cas_number: string
          names: string[]
          synonyms?: string[]
          molecular_weight?: number | null
          fetched_at?: string
        }
        Update: Partial<Database['public']['Tables']['substance_cache']['Insert']>
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          plan: ApiPlan
          calls_used: number
          calls_limit: number | null
          reset_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          key_hash: string
          plan: ApiPlan
          calls_used?: number
          calls_limit?: number | null
          reset_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_type: UserType
      request_type: RequestType
      request_status: RequestStatus
      bid_status: BidStatus
      transaction_status: TransactionStatus
      supplier_plan: SupplierPlan
      market_price_source: MarketPriceSource
      api_plan: ApiPlan
    }
  }
}
