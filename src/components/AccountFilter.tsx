import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/contexts/AccountsContext';
import { useAccountFilter } from '@/hooks/useAccountFilter';

export function AccountFilter() {
  const { accounts } = useAccounts();
  const { accountId, setAccountId } = useAccountFilter();

  return (
    <Select
      value={accountId !== null ? String(accountId) : 'all'}
      onValueChange={(value) =>
        setAccountId(value === 'all' ? null : Number(value))
      }
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Accounts</SelectItem>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={String(account.id)}>
            {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
