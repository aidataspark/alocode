import { SVGProps } from "react"

/**
 * AloLovo component renders the Alo logo with automatic theme adaptation.
 *
 * This component uses the VS Code theme variable `--vscode-icon-foreground` for the fill color,
 * which automatically adjusts based on the active VS Code theme (light, dark, high contrast)
 * to ensure optimal contrast with the background.
 *
 * @param {SVGProps<SVGSVGElement>} props - Standard SVG props including className, style, etc.
 * @returns {JSX.Element} SVG Cline logo that adapts to VS Code themes
 */
const AloLogoVariable = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="128pt"
		height="128pt"
		viewBox="0 0 128 128"
		preserveAspectRatio="xMidYMid meet"
		{...props}>
		<g transform="translate(0,128) scale(0.1,-0.1)" fill="var(--vscode-icon-foreground)" stroke="none">
			<path
				d="M500 1265 c-109 -24 -224 -88 -310 -175 -253 -252 -253 -648 0 -900
252 -253 648 -253 900 0 253 252 253 647 0 901 -155 156 -373 220 -590 174z
m294 -51 c145 -35 297 -155 368 -290 41 -77 72 -185 65 -223 -3 -14 -1 -35 3
-47 30 -78 -178 -162 -455 -185 -300 -25 -638 40 -714 137 -13 17 -19 34 -15
43 4 9 7 31 6 49 -7 122 96 313 217 406 158 122 329 157 525 110z m-599 -733
c129 -43 230 -55 445 -55 264 0 426 29 548 99 37 21 42 22 38 7 -2 -9 -11 -42
-20 -72 -50 -178 -223 -345 -412 -395 -77 -21 -231 -21 -309 0 -211 57 -381
237 -429 457 l-6 27 42 -24 c24 -14 70 -34 103 -44z"
			/>
			<path d="M478 848 c-26 -20 -7 -40 33 -36 26 2 34 8 34 23 0 24 -41 32 -67 13z" />
			<path
				d="M600 840 c0 -17 7 -20 40 -20 33 0 40 3 40 20 0 17 -7 20 -40 20 -33
0 -40 -3 -40 -20z"
			/>
			<path
				d="M734 845 c-9 -23 5 -35 41 -35 38 0 54 24 25 40 -27 14 -60 12 -66
-5z"
			/>
			<path
				d="M335 830 c-4 -6 -2 -17 4 -24 15 -18 75 -6 79 17 3 14 -4 17 -37 17
-22 0 -43 -5 -46 -10z"
			/>
			<path
				d="M862 823 c4 -23 64 -35 79 -17 17 21 1 34 -42 34 -33 0 -40 -3 -37
-17z"
			/>
			<path
				d="M222 809 c-13 -5 -22 -15 -20 -21 7 -19 63 -22 77 -4 25 30 -8 45
-57 25z"
			/>
			<path
				d="M995 811 c-11 -18 15 -41 46 -41 31 0 42 10 30 28 -10 17 -67 26 -76
13z"
			/>
			<path
				d="M108 764 c-31 -16 -36 -32 -12 -41 23 -9 66 14 62 34 -4 23 -18 25
-50 7z"
			/>
			<path
				d="M1120 760 c0 -23 40 -46 64 -37 24 10 19 25 -14 42 -39 20 -50 19
-50 -5z"
			/>
		</g>
	</svg>
)
export default AloLogoVariable
