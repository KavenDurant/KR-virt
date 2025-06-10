/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-05 16:36:21
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-05 16:36:29
 * @FilePath: /KR-virt/src/test/components.test.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "antd";

// 简单的计数器组件示例
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = React.useState(initialCount);

  return (
    <div>
      <span data-testid="count">Count: {count}</span>
      <Button data-testid="increment" onClick={() => setCount(count + 1)}>
        增加
      </Button>
      <Button data-testid="decrement" onClick={() => setCount(count - 1)}>
        减少
      </Button>
    </div>
  );
}

describe("Counter 组件", () => {
  it("应该渲染初始计数", () => {
    render(<Counter initialCount={5} />);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 5");
  });

  it("应该增加计数", () => {
    render(<Counter />);
    const incrementButton = screen.getByTestId("increment");

    fireEvent.click(incrementButton);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 1");

    fireEvent.click(incrementButton);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");
  });

  it("应该减少计数", () => {
    render(<Counter initialCount={3} />);
    const decrementButton = screen.getByTestId("decrement");

    fireEvent.click(decrementButton);
    expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");
  });
});
