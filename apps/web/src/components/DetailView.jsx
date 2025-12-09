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
  onCompose,
  onForward,
  onStar,
  onMarkUnread,
  onMarkAsSpam,
  onUnmarkSpam,
  onDelete,
}) {
  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {composeOpen ? (
        <Compose
          onClose={onCloseCompose}
          onSend={onSendMail}
          initialData={composeInitialData}
        />
      ) : (
        <MessageDetail
          message={message}
          detail={messageDetail}
          loading={loading}
          selectedFolder={selectedFolder}
          onCompose={onCompose}
          onForward={onForward}
          onStar={onStar}
          onMarkUnread={onMarkUnread}
          onMarkAsSpam={onMarkAsSpam}
          onUnmarkSpam={onUnmarkSpam}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

