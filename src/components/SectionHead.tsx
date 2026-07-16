interface SectionHeadProps {
  no: string;
  title: string;
  tag?: string;
}

export default function SectionHead({ no, title, tag }: SectionHeadProps) {
  return (
    <div className="sect-head rv">
      <span className="sect-no">{no}</span>
      <h2 className="sect-title" data-glitch={title}>{title}</h2>
      {tag && <span className="sect-tag">{tag}</span>}
    </div>
  );
}
