import { Request, Response } from "express";
import Mark from "../entity/Mark";
import Statistical from "../entity/Statistical";
import Student from "../entity/Student";
const statisticalController = {
    getAll: async (req: Request, res: Response): Promise<Response> => {
        try {
            const statistical = await Statistical.find();
            return res.json(statistical);
        } catch (error) {
            return res.json({ message: error });
        }
    },
    getByStudentId: async (req: Request, res: Response): Promise<Response> => {
        const { studentId } = req.params;
        try {
            const statistical = await Statistical.find({
                where: {
                    maHocSinh: studentId,
                },
                relations: ["maHocKi", "maHocSinh"],
            });
            if (statistical) {
                statistical.forEach(async (element) => {
                    const mark: any = await element?.tinhDiemTrungBinh(
                        studentId
                    );
                    element!.diemTrungBinh = +mark.toFixed(1);
                    await Statistical.update(element.maThongke, element!);
                    await element?.save();
                });
            }
            return res.json(statistical);
        } catch (error) {
            return res.json({ message: error });
        }
    },
    getByClassId: async (req: Request, res: Response) => {
        const student = await Student.find({
            relations: ["marks"],
            where: {
                lop_maLop: req.params.classId,
            },
        });

        const allMarks = await Mark.find({
            relations: ["monHoc_maMonHoc", "hocKi_maHocKi"],
            where: {
                hocKi_maHocKi: req.params.semesterId,
            },
        });
        const studentMark = student.map((student) => {
            let mark = allMarks.filter((mark) =>
                student.marks.map((mark) => mark.maDiem).includes(mark.maDiem)
            );
            mark.sort((a, b) => {
                return (
                    +a.monHoc_maMonHoc.maMonHoc - +b.monHoc_maMonHoc.maMonHoc
                );
            });
            const { marks, ...other } = student as Student;
            const xepLoai = () => {
                let tongDiem = 0;
                mark.forEach((element) => {
                    tongDiem += element.trungBinhMon;
                });
                tongDiem = +(tongDiem / mark.length).toFixed(1);
                if (tongDiem === 0) return;
                const Gioi = mark.filter((x) => x.trungBinhMon >= 6.5);
                const Kha = mark.filter((x) => x.trungBinhMon >= 5);
                const TrungBinh = mark.filter((x) => x.trungBinhMon >= 3.5);
                if (
                    (mark[10].trungBinhMon >= 8 ||
                        mark[11].trungBinhMon >= 8) &&
                    tongDiem >= 8 &&
                    Gioi.length == mark.length
                ) {
                    return "Giỏi";
                }
                if (
                    (mark[10].trungBinhMon >= 6.5 ||
                        mark[11].trungBinhMon >= 6.5) &&
                    tongDiem >= 6.5 &&
                    Kha.length == mark.length
                ) {
                    return "Khá";
                }
                if (
                    (mark[10].trungBinhMon >= 5 ||
                        mark[11].trungBinhMon >= 5) &&
                    tongDiem >= 5 &&
                    TrungBinh.length == mark.length
                ) {
                    return "Trung bình";
                }
                return "Yếu";
            };
            const tk = (
                mark.reduce((acc, mark) => {
                    return acc + mark.trungBinhMon;
                }, 0) / mark.length
            ).toFixed(1);
            return {
                ...other,
                marks: mark.map((mark) => ({
                    maMonHoc: +mark.monHoc_maMonHoc.maMonHoc,
                    tenMonHoc: mark.monHoc_maMonHoc.tenMonHoc,
                    diemTongKet:
                        mark.trungBinhMon == 0
                            ? "Chưa có điểm"
                            : mark.trungBinhMon,
                })),
                tongKet: +tk == 0.0 ? "Chưa có điểm" : tk,
                xepLoai: xepLoai(),
            };
        });
        const gioiPercent = () => {
            let tongSoHocSinh = studentMark.length;
            let tongSoHocSinhGioi = studentMark.filter(
                (x) => x.xepLoai == "Giỏi"
            ).length;
            return ((tongSoHocSinhGioi / tongSoHocSinh) * 100).toFixed(1);
        };
        const khaPercent = () => {
            let tongSoHocSinh = studentMark.length;
            let tongSoHocSinhKha = studentMark.filter(
                (x) => x.xepLoai == "Khá"
            ).length;
            return ((tongSoHocSinhKha / tongSoHocSinh) * 100).toFixed(1);
        };
        const trungBinhPercent = () => {
            let tongSoHocSinh = studentMark.length;
            let tongSoHocSinhTrungBinh = studentMark.filter(
                (x) => x.xepLoai == "Trung bình"
            ).length;
            return ((tongSoHocSinhTrungBinh / tongSoHocSinh) * 100).toFixed(1);
        };
        const yeuPercent = () => {
            let tongSoHocSinh = studentMark.length;
            let tongSoHocSinhYeu = studentMark.filter(
                (x) => x.xepLoai == "Yếu"
            ).length;
            return ((tongSoHocSinhYeu / tongSoHocSinh) * 100).toFixed(1);
        };
        return res.json({
            studentMark,
            percent: {
                gioiPercent: gioiPercent(),
                khaPercent: khaPercent(),
                trungBinhPercent: trungBinhPercent(),
                yeuPercent: yeuPercent(),
            },
        });
    },
    getByClassIdAndNamHoc: async (req: Request, res: Response) => {
        const student = await Student.find({
            relations: ["marks"],
            where: {
                lop_maLop: req.params.classId,
            },
        });

        const allMarks = await Mark.find({
            relations: ["monHoc_maMonHoc", "hocKi_maHocKi"],
            where: {
                hocKi_maHocKi: {
                    namHoc: req.params.namHoc,
                },
            },
        });
        const studentMark = student.map((student) => {
            let mark = allMarks.filter((mark) =>
                student.marks.map((mark) => mark.maDiem).includes(mark.maDiem)
            );

            mark.sort((a, b) => {
                return (
                    +a.monHoc_maMonHoc.maMonHoc - +b.monHoc_maMonHoc.maMonHoc
                );
            });
            const { marks, ...other } = student as Student;
            const HK1 = (
                mark
                    .filter((x) => x.hocKi_maHocKi.hocKi == 1)
                    .reduce((acc, mark) => {
                        return acc + mark.trungBinhMon;
                    }, 0) /
                mark.filter((x) => x.hocKi_maHocKi.hocKi == 1).length
            ).toFixed(1);
            const HK2 = (
                mark
                    .filter((x) => x.hocKi_maHocKi.hocKi == 2)
                    .reduce((acc, mark) => {
                        return acc + mark.trungBinhMon;
                    }, 0) /
                mark.filter((x) => x.hocKi_maHocKi.hocKi == 2).length
            ).toFixed(1);

            return {
                ...other,
                marks: mark.map((marks, index) => {
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 1 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 2 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 3 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1) || 0;
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 4 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 5 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 6 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 7 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 8 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 9 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 10 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 11 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem ?? 0,
                        };
                    }
                    if (
                        +marks.monHoc_maMonHoc.maMonHoc == 12 &&
                        marks.hocKi_maHocKi.hocKi == 1
                    ) {
                        let hk1 = marks.trungBinhMon;
                        let hk2 = mark[index + 1].trungBinhMon;
                        let tongDiem = +((+hk1 + +hk2 * 2) / 3).toFixed(1);
                        return {
                            maMonHoc: +marks.monHoc_maMonHoc.maMonHoc,
                            tenMonHoc: marks.monHoc_maMonHoc.tenMonHoc,
                            diemTongKet: tongDiem,
                        };
                    }
                }),
                tongKet: {
                    HK1,
                    HK2,
                    ALL: ((+HK1 + +HK2 * 2) / 3).toFixed(1),
                },
            };
        });
        const cn = studentMark.map((student) => {
            const { marks, ...other } = student;
            let diem = marks
                .map((marks) => {
                    return marks != null
                        ? marks
                        : {
                              maMonHoc: 0,
                              tenMonHoc: "",
                              diemTongKet: 0,
                          };
                })
                .filter((marks) => marks.diemTongKet != 0);
            const xepLoai = () => {
                const Gioi = diem.filter((x) => x.diemTongKet >= 6.5);
                const Kha = diem.filter((x) => x.diemTongKet >= 5);
                const TrungBinh = diem.filter((x) => x.diemTongKet >= 3.5);
                if (
                    (diem[10].diemTongKet >= 8 || diem[11].diemTongKet >= 8) &&
                    +student.tongKet.ALL >= 8 &&
                    Gioi.length == diem.length
                ) {
                    return "Giỏi";
                }
                if (
                    (diem[10].diemTongKet >= 6.5 ||
                        diem[11].diemTongKet >= 6.5) &&
                    +student.tongKet.ALL >= 6.5 &&
                    Kha.length == diem.length
                ) {
                    return "Khá";
                }
                if (
                    (diem[10]!.diemTongKet >= 5 || diem[11].diemTongKet >= 5) &&
                    +student.tongKet.ALL >= 5 &&
                    TrungBinh.length == diem.length
                ) {
                    return "Trung bình";
                }
                return "Yếu";
            };
            return {
                ...other,
                xepLoai: xepLoai(),
            };
        });

        return res.json(cn);
    },
};

export default statisticalController;
