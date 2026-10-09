import { useState, useCallback, useEffect, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ShieldCheck, UserPlus, KeyRound, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserRole,
  ManagedUser,
  PRIMARY_ADMIN_EMAIL,
  MIN_PASSWORD_LENGTH,
  listUsers,
  createUser,
  setPassword,
  setRole,
  deleteUser,
} from '@/lib/auth';

const Admin = () => {
  const { user, refresh } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isCreating, setIsCreating] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await listUsers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const reload = useCallback(async () => {
    await loadUsers();
    await refresh();
  }, [loadUsers, refresh]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createUser(newEmail, newPassword, newRole);
      toast.success(`Registered ${newEmail.trim().toLowerCase()} as ${newRole}`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (target: ManagedUser, role: UserRole) => {
    setBusyId(target.id);
    try {
      await setRole(target.id, role);
      toast.success(`${target.email} is now ${role === 'admin' ? 'an admin' : 'a user'}`);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    setIsSavingPassword(true);
    try {
      await setPassword(passwordTarget.id, resetPassword);
      toast.success(`Password updated for ${passwordTarget.email}`);
      setPasswordTarget(null);
      setResetPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setBusyId(target.id);
    try {
      await deleteUser(target.id);
      toast.success(`Removed ${target.email}`);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove user');
    } finally {
      setBusyId(null);
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card-elevated">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Register emails and manage who can sign in</p>
            </div>
          </div>
        </div>

        {/* Register new account */}
        <div className="card-elevated">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Register New Account
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="newEmail" className="text-sm font-medium">Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="teacher@school.com"
                className="input-field"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
                className="input-field"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isCreating} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {isCreating ? 'Adding...' : 'Add'}
            </Button>
          </form>
        </div>

        {/* Registered accounts */}
        <div className="card-elevated">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
            Registered Accounts <span className="text-muted-foreground font-normal">({users.length})</span>
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-40">Role</TableHead>
                  <TableHead className="w-36">Added</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Loading accounts...</TableCell>
                  </TableRow>
                )}
                {users.map(u => {
                  const isPrimary = u.email === PRIMARY_ADMIN_EMAIL;
                  const isSelf = u.id === user?.id;
                  const isLastAdmin = u.role === 'admin' && adminCount <= 1;
                  const isBusy = busyId === u.id;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.email}
                          {isPrimary && <Badge variant="outline">Primary</Badge>}
                          {isSelf && <Badge variant="secondary">You</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u, v as UserRole)}
                          disabled={isPrimary || isLastAdmin || isBusy}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Set password"
                            onClick={() => { setPasswordTarget(u); setResetPassword(''); }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={isPrimary ? 'Primary admin cannot be removed' : isSelf ? 'You cannot remove yourself' : 'Remove'}
                            disabled={isPrimary || isSelf || isBusy}
                            onClick={() => setDeleteTarget(u)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Set password dialog */}
      <Dialog open={passwordTarget !== null} onOpenChange={(open) => !open && setPasswordTarget(null)}>
        <DialogContent className="bg-card">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Set Password</DialogTitle>
              <DialogDescription>Choose a new password for {passwordTarget?.email}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="resetPassword" className="text-sm font-medium">New Password</Label>
              <Input
                id="resetPassword"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
                className="input-field"
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? 'Saving...' : 'Save Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} will no longer be able to sign in. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
