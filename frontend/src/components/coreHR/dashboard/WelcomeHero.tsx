import React from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser, getGreeting } from "./helpers";
import Icons from "./Icons";

const I = Icons;

interface WelcomeHeroProps {
  today: string;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({ today }) => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border-light bg-surface-light shadow-card">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-teal-500/10 to-cyan-400/5 pointer-events-none" />
      <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-primary/8 pointer-events-none" />
      <div className="absolute right-24 top-4 w-24 h-24 rounded-full bg-teal-400/8 pointer-events-none" />
      <div className="relative px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-secondary-light">
              {today}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-text-primary-light tracking-tight">
            {getGreeting()}, {currentUser.name.split(" ").at(-1)} 👋
          </h1>
          <p className="text-sm text-text-secondary-light mt-1">
            Here's what's happening across your organization today.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            id="dashboard-goto-employees"
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-sm btn-primary-action"
          >
            {I.users} View Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;
