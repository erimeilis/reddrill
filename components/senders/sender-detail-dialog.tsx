import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MandrillSenderInfo } from '@/lib/api/mandrill';

interface SenderDetailDialogProps {
  sender: MandrillSenderInfo | null;
  senderAddress: string | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
}

export function SenderDetailDialog({ sender, senderAddress, isOpen, onClose, loading }: SenderDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sender Details: {senderAddress}</DialogTitle>
          <DialogDescription>
            Detailed information about this sender
          </DialogDescription>
        </DialogHeader>

        {sender ? (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium">Total Sent:</dt>
                      <dd>{sender.sent}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Last 30 Days Sent:</dt>
                      <dd>{sender.stats?.last_30_days?.sent ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Last 30 Days Opens:</dt>
                      <dd>{sender.stats?.last_30_days?.opens ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Last 30 Days Clicks:</dt>
                      <dd>{sender.stats?.last_30_days?.clicks ?? 0}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Last 7 Days Sent:</dt>
                      <dd>{sender.stats?.last_7_days?.sent ?? 0}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>DKIM</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium">Signed By:</dt>
                      <dd>{sender.dkim?.signed_by || 'None'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Valid:</dt>
                      <dd>{sender.dkim?.valid ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>SPF</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Valid:</dt>
                    <dd>{sender.spf?.valid ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Valid With DKIM:</dt>
                    <dd>{sender.spf?.valid_with_dkim ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {loading ? (
              <div className="flex justify-center items-center">
                <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading sender details...
              </div>
            ) : (
              <div>Error loading sender details. Please try again.</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
