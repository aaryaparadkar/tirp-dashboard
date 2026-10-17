import { useState } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  MessagesSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  TriangleAlertIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageSection,
} from "@/components/app"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Specimen } from "./specimen"

export function FeedbackSection() {
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <PageSection
        id="feedback"
        title="Feedback"
        description="Alerts, progress, and toasts keep people informed. Nothing
          important depends on a toast alone."
      >
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 lg:grid-cols-2">
            <Alert>
              <InfoIcon />
              <AlertTitle>Webhook signature verified</AlertTitle>
              <AlertDescription>
                Messages are being accepted from the Kapso webhook.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Conversation failed to send</AlertTitle>
              <AlertDescription>
                The recipient may have blocked the number. Retry from the detail
                view.
              </AlertDescription>
            </Alert>
          </div>

          <Specimen label="Progress and spinners" className="block w-full">
            <div className="flex w-full max-w-md flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">
                  Importing history · 64%
                </span>
                <Progress value={64} />
              </div>
              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                <Spinner />
                Loading conversations…
              </div>
            </div>
          </Specimen>

          <Specimen label="Toasts">
            <Button
              variant="outline"
              onClick={() => toast.success("Reply sent")}
            >
              <CircleCheckIcon data-icon="inline-start" />
              Success toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Send failed", {
                  description: "The number is not on WhatsApp.",
                })
              }
            >
              Error toast
            </Button>
          </Specimen>
        </div>
      </PageSection>

      <PageSection
        id="states"
        title="Empty, loading, and error states"
        description="Every data view defines all three. Each state explains what is
          happening and what to do next."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              Empty
            </span>
            <EmptyState
              icon={MessagesSquareIcon}
              title="No conversations yet"
              description="Once the assistant handles its first message, it appears here."
              action={
                <Button size="sm" variant="outline">
                  <PlusIcon data-icon="inline-start" />
                  Start a test conversation
                </Button>
              }
            />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              Loading
            </span>
            <LoadingState variant="list" rows={3} />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              Error
            </span>
            <ErrorState
              title="Couldn't load conversations"
              description="The server did not respond in time."
              onRetry={() => toast("Retrying…")}
            />
          </div>
        </div>
      </PageSection>

      <PageSection
        id="overlays"
        title="Overlays"
        description="Dialog for tasks that need focus, sheet for side panels, drawer
          for mobile, alert dialog for confirmations. All carry a title for
          assistive tech."
      >
        <div className="flex flex-col gap-8">
          <Specimen label="Dialog, sheet, and drawer">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign reviewer</DialogTitle>
                  <DialogDescription>
                    Pick a teammate to review this conversation.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Assign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Narrow the conversation list.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Conversation actions</DrawerTitle>
                  <DrawerDescription>
                    Actions for the selected conversation.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button variant="outline">Close</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete conversation</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the message history and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Specimen>

          <Specimen label="Menu, tooltip, and command palette">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Conversation actions"
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShareIcon />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover for tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                Masks the phone number in the list
              </TooltipContent>
            </Tooltip>

            <Button variant="outline" onClick={() => setCommandOpen(true)}>
              <SearchIcon data-icon="inline-start" />
              Open command palette
            </Button>
            <CommandDialog
              open={commandOpen}
              onOpenChange={setCommandOpen}
              title="Command palette"
              description="Search conversations and actions"
            >
              <CommandInput placeholder="Type a command or search…" />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Actions">
                  <CommandItem value="mask phone numbers">
                    Mask phone numbers
                  </CommandItem>
                  <CommandItem value="export csv">Export as CSV</CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>
          </Specimen>
        </div>
      </PageSection>

      <PageSection
        id="motion"
        title="Motion"
        description="Motion answers an action or marks a single entrance — never a
          scattered effect on every element. All of it collapses under
          prefers-reduced-motion."
      >
        <MotionDemo />
      </PageSection>
    </>
  )
}

function MotionDemo() {
  const [runId, setRunId] = useState(0)

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => setRunId((id) => id + 1)}
      >
        Replay entrance
      </Button>
      <div key={runId} className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="animate-rise-in bg-card text-muted-foreground rounded-lg border p-4 text-sm"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            Revealed item {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
