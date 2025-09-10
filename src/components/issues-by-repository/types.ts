export interface Repository {
  name: string;
  issueCount: number;
  hasIcon?: boolean;
}

export interface IssuesByRepositoryProps {
  repositories: Repository[];
  timePeriod?: string;
} 