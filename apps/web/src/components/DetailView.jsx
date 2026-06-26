import { Compose } from "./Compose";
import { MessageDetail } from "./MessageDetail";

export function DetailView({
  composeOpen,
  composeInitialData,
  onCloseCompose,
  onSendMail,
  message,
  messageDetail,
  loading,
  selectedFolder,
  onReply,
  onCompose,
  onForward,
  onStar,
  onMarkUnread,
  onMarkAsSpam,
  onUnmarkSpam,
  onRestoreFromTrash,
  onDelete,
  onBack,
  defaultFrom,
  defaultFromName,
}) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden min-w-0 w-full">
      {composeOpen ? (
        <Compose
          onClose={onCloseCompose}
          onSend={onSendMail}
          initialData={composeInitialData}
          defaultFrom={defaultFrom}
          defaultFromName={defaultFromName}
        />
      ) : (
        <MessageDetail
          message={message}
          detail={messageDetail}
          loading={loading}
          selectedFolder={selectedFolder}
          onReply={onReply}
          onCompose={onCompose}
          onForward={onForward}
          onStar={onStar}
          onMarkUnread={onMarkUnread}
          onMarkAsSpam={onMarkAsSpam}
          onUnmarkSpam={onUnmarkSpam}
          onRestoreFromTrash={onRestoreFromTrash}
          onDelete={onDelete}
          onBack={onBack}
        />
      )}
    </div>
  );
}

