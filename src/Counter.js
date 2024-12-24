import React, { useState } from 'react';

const Counter = () => {
    const [count, setCount] = useState(0);
    const [optimisticCount, setOptimisticCount] = useState(0);

    const increment = () => {
        setOptimisticCount(count + 1); // 낙관적 업데이트
        setTimeout(() => setCount((prev) => prev + 1), 1000); // 실제 업데이트
    };

    return (
        <div>
            <p>실제 값: {count}</p>
            <p>낙관적 값: {optimisticCount}</p>
            <button onClick={increment}>+1</button>
        </div>
    );
};

export default Counter;  // 이 부분이 있는지 확인