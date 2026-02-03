"use client";

import { useState, useRef, useEffect } from "react";

export function ResizablePanel({
    leftPanel,
    rightPanel,
    defaultLeftWidth = 400,
    minLeftWidth = 250,
    maxLeftWidth = 800,
    className = ""
}) {
    const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;

            // Constrain the width
            if (newWidth >= minLeftWidth && newWidth <= maxLeftWidth) {
                setLeftWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging, minLeftWidth, maxLeftWidth]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    return (
        <div ref={containerRef} className={`flex overflow-hidden ${className}`}>
            {/* Left Panel */}
            <div
                style={{ width: `${leftWidth}px` }}
                className="flex-shrink-0 overflow-hidden"
            >
                {leftPanel}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`
          w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors
          relative group flex-shrink-0
          ${isDragging ? "bg-primary" : ""}
        `}
            >
                {/* Visual indicator on hover */}
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10" />
            </div>

            {/* Right Panel */}
            <div className="flex-1 overflow-hidden min-w-0">
                {rightPanel}
            </div>
        </div>
    );
}
