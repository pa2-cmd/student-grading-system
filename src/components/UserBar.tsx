import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, ShieldCheck, ClipboardList, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function UserBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const onAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground min-w-0">
          <UserCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">{user.email}</span>
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
            {user.role}
          </Badge>
        </div>
        {user.role === 'admin' && (
          <Button asChild variant="ghost" size="sm" className="gap-2">
            {onAdminPage ? (
              <Link to="/"><ClipboardList className="h-4 w-4" />Assessment Tool</Link>
            ) : (
              <Link to="/admin"><ShieldCheck className="h-4 w-4" />Admin Panel</Link>
            )}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
