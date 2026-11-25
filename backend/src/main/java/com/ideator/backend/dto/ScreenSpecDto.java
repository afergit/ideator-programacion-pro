package com.ideator.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScreenSpecDto {
    private String name;
    private String route;
    private String description;
    @Builder.Default
    private List<String> components = new ArrayList<>();
    private String mockupUrl;
    private String wireframeHtml;
    @Builder.Default
    private List<String> consumedEndpoints = new ArrayList<>();
    @Builder.Default
    private List<String> validations = new ArrayList<>();
}
