import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { CustomText } from "./CustomText";
import { theme } from "@/context/ThemeContext";

export const BackButton = React.memo(({ navigation, title }: { navigation: any; title: string }) => (
    <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ flexDirection: 'row', alignItems: 'center' }}
    >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        <CustomText style={{ marginLeft: 8, fontSize: 16 }}>{title}</CustomText>
    </TouchableOpacity>
));