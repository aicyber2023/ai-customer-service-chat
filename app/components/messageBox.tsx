import React, { useState } from "react";
import styles from "@/app/components/messageBox.module.scss";

// @ts-ignore
const Popup = ({ isOpen, onClose, onConfirm, onCancel }) => {
  const handleClose = () => {
    onClose && onClose();
  };

  const handleConfirm = () => {
    onConfirm && onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    onCancel && onCancel();
  };

  return (
    <>
      {isOpen && (
        <div className={styles["overlay"]} onClick={onClose}>
          <div className={styles["popup"]} onClick={(e) => e.stopPropagation()}>
            <p>重新生成后，旧KEY将被废除，确认重新生成吗？</p>
            <div className={styles["btn"]}>
              <button onClick={handleCancel} className={styles["close"]}>
                取消
              </button>
              <button onClick={handleConfirm} className={styles["confirm"]}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Popup;
