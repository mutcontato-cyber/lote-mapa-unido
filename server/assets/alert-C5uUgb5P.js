import { c as cn } from "./card-yjQJoboh.js";
import * as React from "react";
import { jsx } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";
//#region src/components/ui/input.tsx
var Input = React.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ jsx("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
//#endregion
//#region src/components/ui/label.tsx
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(LabelPrimitive.Root, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = LabelPrimitive.Root.displayName;
//#endregion
//#region src/components/ui/alert.tsx
var alertVariants = cva("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7", {
	variants: { variant: {
		default: "bg-background text-foreground",
		destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
	} },
	defaultVariants: { variant: "default" }
});
var Alert = React.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	role: "alert",
	className: cn(alertVariants({ variant }), className),
	...props
}));
Alert.displayName = "Alert";
var AlertTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("h5", {
	ref,
	className: cn("mb-1 font-medium leading-none tracking-tight", className),
	...props
}));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("text-sm [&_p]:leading-relaxed", className),
	...props
}));
AlertDescription.displayName = "AlertDescription";
//#endregion
export { Input as i, AlertDescription as n, Label as r, Alert as t };
