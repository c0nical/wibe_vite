import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const Toast = ({ message, isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 md:right-8 bg-green-500 text-black px-4 py-2 rounded-lg shadow-lg z-50 md:max-w-sm w-[90%] md:w-auto mx-auto"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;