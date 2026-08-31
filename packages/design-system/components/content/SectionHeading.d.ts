/** Category group heading in edition order: name (Bricolage 20/700) + mono count, e.g. "Repos · 9". The count is the app's only echo of the newsletter's hex numbering. */
export interface SectionHeadingProps {
  name: string;
  count: number;
  /** anchor id so category chips can scroll to the section */
  id?: string;
}
export declare function SectionHeading(props: SectionHeadingProps): JSX.Element;
