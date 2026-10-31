export interface MovieProps {
  id: number | null;
  name: string;
  ageRestriction: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MovieChanges {
  name?: string;
  ageRestriction?: number;
}

export class Movie {
  private constructor(private readonly props: MovieProps) {}

  static create(props: { name: string; ageRestriction: number }): Movie {
    return new Movie({
      id: null,
      name: props.name,
      ageRestriction: props.ageRestriction,
      createdAt: null,
      updatedAt: null,
    });
  }

  static restore(props: MovieProps): Movie {
    return new Movie({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get ageRestriction(): number {
    return this.props.ageRestriction;
  }

  get createdAt(): Date | null {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  update(changes: MovieChanges): void {
    if (changes.name !== undefined) {
      this.props.name = changes.name;
    }
    if (changes.ageRestriction !== undefined) {
      this.props.ageRestriction = changes.ageRestriction;
    }
  }
}
