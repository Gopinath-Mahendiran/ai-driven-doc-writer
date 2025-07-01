import clsx from "clsx";

const Button = ({
  icon,
  children,
  href,
  containerClassName,
  onClick
}) => {
  const Inner = () => (
    <>
      <span className="relative flex items-center min-h-[36px] px-4 g4 rounded-2xl inner-before group-hover:before:opacity-100 overflow-hidden">
        <span className="absolute -left-[1px]">
        </span>

        {icon && (
          <img
            src={icon}
            alt="circle"
            className="size-5 mr-5 object-contain z-10"
          />
        )}

        <span className="relative z-2 primary-font base-bold text-p1 ">
          {children}
        </span>
      </span>

      <span className="glow-before glow-after" />
    </>
  );
  return href ? (
    <a
      className={clsx(
        "relative p-0.1 rounded shadow-500 group",
        containerClassName,
      )}
      href={href}
    >
      <Inner />
    </a>
  ) : (
    <button
      className={clsx(
        "relative p-0.1 g5 rounded- shadow-500 group px-2 py-0",
        containerClassName,
      )}
      onClick={onClick}
    >
      <Inner />
    </button>
  );
};
export default Button;