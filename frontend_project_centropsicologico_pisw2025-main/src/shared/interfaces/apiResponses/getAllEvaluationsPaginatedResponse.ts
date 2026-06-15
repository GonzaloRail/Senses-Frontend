interface EvaluationListItem {
  id: string;
  name: string;
  isActive: boolean;
  testCount: number;
}

export interface EvaluationsPaginatedResponse {
  currentPage: number;
  totalPages: number;
  evaluations: EvaluationListItem[];
}