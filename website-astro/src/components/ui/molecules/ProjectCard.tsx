export interface ProjectCardProps {
  name: string;
  description: string;
  issueCount: number;
  memberAvatars: string[];
  href: string;
}

export default function ProjectCard({ name, description, issueCount, memberAvatars, href }: ProjectCardProps) {
  return (
    <a
      href={href}
      className="block bg-bg-card rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border border-bg-warm"
    >
      <h3 className="font-pixel text-sm text-primary-dark mb-1 truncate">{name}</h3>
      <p className="text-xs text-text-mid line-clamp-2 mb-4 min-h-[2rem]">
        {description || '\u00A0'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-mid">{issueCount} issues</span>
        <div className="flex -space-x-2">
          {memberAvatars.slice(0, 5).map((avatar, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-primary-light/30 border-2 border-white flex items-center justify-center text-[8px] text-primary-dark font-bold"
              title={avatar}
            >
              {avatar.charAt(0).toUpperCase()}
            </div>
          ))}
          {memberAvatars.length > 5 && (
            <div className="w-6 h-6 rounded-full bg-bg-warm border-2 border-white flex items-center justify-center text-[8px] text-text-mid">
              +{memberAvatars.length - 5}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
