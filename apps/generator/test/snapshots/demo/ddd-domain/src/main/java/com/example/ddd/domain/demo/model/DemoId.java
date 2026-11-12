package com.example.ddd.domain.demo.model;

import com.example.ddd.domain.shared.SnowflakeIdGenerator;
import java.util.Objects;

/**
 * DemoID（值对象）：雪花 long 标识。
 *
 * <p>用值对象替代裸 long，把语义与取值约束收敛到类型内部。
 * ID 由领域层生成（雪花算法），JSON 输出时序列化为字符串避免前端精度丢失。</p>
 */
public final class DemoId {

    private final long value;

    private DemoId(long value) {
        if (value <= 0) {
            throw new IllegalArgumentException("DemoID必须为正数: " + value);
        }
        this.value = value;
    }

    /** 由已知数值构造（持久化还原、显式指定） */
    public static DemoId of(long value) {
        return new DemoId(value);
    }

    /** 由字符串解析（HTTP 路径/请求参数）；非数字视为非法参数 */
    public static DemoId parse(String value) {
        try {
            return new DemoId(Long.parseLong(value));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("DemoID格式无效: " + value);
        }
    }

    /** 由雪花算法生成下一个 ID */
    public static DemoId next() {
        return new DemoId(SnowflakeIdGenerator.nextId());
    }

    public long value() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof DemoId other && value == other.value;
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return String.valueOf(value);
    }
}
