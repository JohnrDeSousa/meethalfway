import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Venue } from "@/types";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue;
  planId: string;
}

export function ShareDialog({ isOpen, onClose, venue, planId }: ShareDialogProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/plan/${planId}?venue=${venue.id}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The share link has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Check out ${venue.name} for our meeting! ${shareUrl}`
    );
    window.open(`sms:?body=${message}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Meeting spot suggestion: ${venue.name}`);
    const body = encodeURIComponent(
      `Hi!\n\nI found a great meeting spot for us: ${venue.name}\n\nLocation: ${venue.address}\n\nCheck out all the details here: ${shareUrl}\n\nSee you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle>Share {venue.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="share-url" className="text-sm font-medium mb-2 block">
              Share Link
            </Label>
            <div className="flex">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="flex-1 bg-muted text-sm"
                data-testid="input-share-url"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="ml-2"
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={shareViaSMS}
              className="w-full"
              data-testid="button-share-sms"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send SMS
            </Button>
            <Button
              variant="secondary"
              onClick={shareViaEmail}
              className="w-full"
              data-testid="button-share-email"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            This link will show the venue details and directions for everyone in your group.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
